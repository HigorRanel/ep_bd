import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import Config
from contextlib import contextmanager


class Database:
    @staticmethod
    def get_connection():
        return psycopg2.connect(
            host=Config.DB_HOST,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            port=Config.DB_PORT
        )

    @staticmethod
    @contextmanager
    def get_cursor(dict_cursor=True):
        conn = Database.get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor) if dict_cursor else conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()