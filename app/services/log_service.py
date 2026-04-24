from app.models.log import Log
from app import db
from sqlalchemy import or_, and_, not_
import re


class LogService:
    """
    Log arama servisi. SRS §5.2.b gereği AND / OR / NOT mantıksal operatörlerini destekler.
    Arama yalnızca `action` alanında yapılır, case-insensitive.
    """

    @staticmethod
    def get_logs(page=1, per_page=20):
        """Filtresiz, tüm logları tarihe göre ters sıralı listele."""
        return Log.query.order_by(Log.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def advanced_search(search_term, page=1, per_page=20):
        """
        Gelişmiş arama — SRS §5.2.b'ye uygun AND/OR/NOT desteği.

        Örnek sorgular:
          "CREATE"                    → action içinde CREATE geçen
          "CREATE AND reservation"    → her iki kelimeyi de içeren
          "CREATE OR DELETE"          → ikisinden birini içeren
          "CREATE NOT service"        → CREATE içerip service içermeyen
          "UPDATE AND user NOT admin" → kombinasyon

        Varsayılan operatör AND'dir (boşlukla ayrılmış kelimeler AND ile birleştirilir).
        """
        query = Log.query

        if search_term and search_term.strip():
            condition = LogService._parse_query(search_term.strip())
            if condition is not None:
                query = query.filter(condition)

        return query.order_by(Log.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    # ───────────────────────────────────────────────────────────────
    # Mantıksal ifade parser — AND/OR/NOT
    # ───────────────────────────────────────────────────────────────
    @staticmethod
    def _parse_query(search_term):
        """
        Basit bir recursive-descent parser. Operatörleri büyük harfle tanır:
        AND, OR, NOT. Diğer her şey arama kelimesi olarak işlenir.
        """
        tokens = LogService._tokenize(search_term)
        if not tokens:
            return None
        parser = _LogicParser(tokens)
        return parser.parse_or()

    @staticmethod
    def _tokenize(text):
        """'CREATE AND user NOT admin' → ['CREATE', 'AND', 'user', 'NOT', 'admin']"""
        return [t for t in re.split(r'\s+', text) if t]


class _LogicParser:
    """
    Gramer:
      OR_EXPR  := AND_EXPR (OR AND_EXPR)*
      AND_EXPR := NOT_EXPR (AND NOT_EXPR)*       (implicit AND: boşlukla ayrılmış terimler)
      NOT_EXPR := (NOT)? TERM
      TERM     := kelime (case-insensitive ilike '%kelime%')
    """

    OPERATORS = {'AND', 'OR', 'NOT'}

    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def _peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def _consume(self):
        tok = self._peek()
        self.pos += 1
        return tok

    def parse_or(self):
        left = self.parse_and()
        while self._peek() == 'OR':
            self._consume()
            right = self.parse_and()
            if right is not None and left is not None:
                left = or_(left, right)
            elif right is not None:
                left = right
        return left

    def parse_and(self):
        left = self.parse_not()
        while self._peek() is not None and self._peek() != 'OR':
            # implicit AND (boşluk) veya explicit AND
            if self._peek() == 'AND':
                self._consume()
            right = self.parse_not()
            if right is None:
                break
            if left is not None:
                left = and_(left, right)
            else:
                left = right
        return left

    def parse_not(self):
        if self._peek() == 'NOT':
            self._consume()
            term = self.parse_term()
            if term is None:
                return None
            return not_(term)
        return self.parse_term()

    def parse_term(self):
        tok = self._peek()
        if tok is None or tok in self.OPERATORS:
            return None
        self._consume()
        return Log.action.ilike(f'%{tok}%')
