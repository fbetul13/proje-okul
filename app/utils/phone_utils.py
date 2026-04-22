import re


def normalize_tr_mobile_phone(raw):
    """
    TR cep telefonunu DB'de 0XXXXXXXXXX (11 hane) olarak saklar.
    Boş / sadece boşluk -> None.
    Geçersizse (msg, None) döner.
    """
    if raw is None:
        return None, None
    s = str(raw).strip()
    if not s:
        return None, None

    d = re.sub(r"\D+", "", s)
    if not d:
        return "Geçerli bir telefon numarası girin", None

    if d.startswith("00"):
        d = d[2:]
    if d.startswith("90") and len(d) >= 12:
        d = d[2:]
    if d.startswith("0") and len(d) == 11 and d[1] == "5":
        pass
    elif len(d) == 10 and d[0] == "5":
        d = "0" + d
    else:
        return "Cep numarası 05XX XXX XX XX formatında olmalı", None

    if len(d) != 11 or not d.startswith("05") or d[2] not in "345690":
        return "Cep numarası 05XX XXX XX XX formatında olmalı", None

    return None, d
