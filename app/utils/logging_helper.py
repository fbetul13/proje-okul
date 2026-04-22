from app import db
from app.models.log import Log
from datetime import datetime

def log_action(user_id, action, affected_record_id=None):
    """
    Utility function to log system actions.
    """
    new_log = Log(
        user_id=user_id,
        action=action,
        affected_record_id=affected_record_id,
        timestamp=datetime.utcnow()
    )
    db.session.add(new_log)
    db.session.commit()
