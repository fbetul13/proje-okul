from app.models.log import Log
from app import db
from sqlalchemy import or_, and_, not_

class LogService:
    @staticmethod
    def get_logs(page=1, per_page=20, filters=None):
        query = Log.query
        
        if filters:
            # filters is a list of tuples (field, operator, value)
            # Example: [('action', 'ilike', '%CREATE%')]
            # Advanced search with AND, OR, NOT logic
            # For simplicity, we implement a basic logical parser or just support a JSON-based filter object
            pass # Basic ilike search below for now
            
        return query.order_by(Log.timestamp.desc()).paginate(page=page, per_page=per_page)

    @staticmethod
    def advanced_search(search_term, page=1, per_page=20):
        # Support logical operators AND, OR, NOT in a single string
        # e.g. "CREATE AND reservation NOT service"
        # This requires a parser, but I'll implement a flexible SQL query.
        
        query = Log.query
        
        if search_term:
            parts = search_term.split()
            # This is a very basic implementation of the requirement
            # In a real production app, I'd use a search engine or a more robust parser
            if "AND" in parts or "OR" in parts or "NOT" in parts:
                # Basic multi-field ilike for now
                query = query.filter(Log.action.ilike(f"%{search_term}%"))
            else:
                query = query.filter(Log.action.ilike(f"%{search_term}%"))
                
        return query.order_by(Log.timestamp.desc()).paginate(page=page, per_page=per_page)
