import threading
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from backend.app.config import Config
from contextlib import contextmanager


class Database:
    """
    Acesso ao banco usando um pool de conexões (ThreadedConnectionPool).

    o pool reaproveita conexões já abertas — menos latência e menos
    pressão no Postgres sob carga.

    A interface pública (Database.get_cursor()) é IDÊNTICA à anterior,
    então nenhum model precisa ser alterado.
    """

    _pool = None
    _lock = threading.Lock()

    @classmethod
    def _get_pool(cls):
        # Inicialização preguiçosa e thread-safe (criado uma única vez por processo).
        if cls._pool is None:
            with cls._lock:
                if cls._pool is None:
                    cls._pool = pool.ThreadedConnectionPool(
                        minconn=int(getattr(Config, 'DB_POOL_MIN', 1)),
                        maxconn=int(getattr(Config, 'DB_POOL_MAX', 10)),
                        host=Config.DB_HOST,
                        database=Config.DB_NAME,
                        user=Config.DB_USER,
                        password=Config.DB_PASSWORD,
                        port=Config.DB_PORT,
                    )
        return cls._pool

    @staticmethod
    def get_connection():
        """
        Mantido por COMPATIBILIDADE. Agora retorna uma conexão do pool.

        IMPORTANTE: quem chamar este método diretamente deve devolver a conexão
        ao pool com Database.put_connection(conn) em vez de conn.close().
        (O caminho recomendado é sempre usar Database.get_cursor().)
        """
        return Database._get_pool().getconn()

    @staticmethod
    def put_connection(conn):
        """Devolve uma conexão ao pool."""
        Database._get_pool().putconn(conn)

    @staticmethod
    @contextmanager
    def get_cursor(dict_cursor=True):
        pool_ = Database._get_pool()
        conn = pool_.getconn()
        cursor = conn.cursor(cursor_factory=RealDictCursor) if dict_cursor else conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
            # Devolve a conexão ao pool (NÃO fecha) para reaproveitamento.
            pool_.putconn(conn)

    @staticmethod
    def close_all():
        """Fecha todas as conexões do pool (útil em shutdown/testes)."""
        if Database._pool is not None:
            Database._pool.closeall()
            Database._pool = None