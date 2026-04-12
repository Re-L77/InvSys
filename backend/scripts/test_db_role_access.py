import os
from dataclasses import dataclass

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


@dataclass
class RoleCheck:
    name: str
    sql: str
    should_pass: bool


def run_check(db_url: str, check: RoleCheck) -> tuple[bool, str | None]:
    engine = create_engine(db_url, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            conn.execute(text(check.sql))
        if check.should_pass:
            return True, None
        return False, "Expected failure but query succeeded"
    except SQLAlchemyError as exc:
        if check.should_pass:
            return False, str(exc)
        return True, None


def get_required_env(var_name: str) -> str:
    value = os.getenv(var_name)
    if not value:
        raise ValueError(f"Missing required env var: {var_name}")
    return value


def main() -> int:
    load_dotenv()

    admin_url = get_required_env("DB_TEST_ADMIN_URL")
    almacen_url = get_required_env("DB_TEST_ALMACEN_URL")
    super_url = get_required_env("DB_TEST_SUPER_URL")

    checks: dict[str, tuple[str, list[RoleCheck]]] = {
        "admin": (
            admin_url,
            [
                RoleCheck("SELECT productos", "SELECT 1 FROM Productos LIMIT 1", True),
                RoleCheck(
                    "CALL sp_consultar_inventario",
                    "CALL sp_consultar_inventario()",
                    True,
                ),
                RoleCheck(
                    "SELECT vista_inventario_actual",
                    "SELECT 1 FROM vista_inventario_actual LIMIT 1",
                    True,
                ),
            ],
        ),
        "almacenista": (
            almacen_url,
            [
                RoleCheck("SELECT productos", "SELECT 1 FROM Productos LIMIT 1", True),
                RoleCheck(
                    "CALL sp_consultar_inventario",
                    "CALL sp_consultar_inventario()",
                    True,
                ),
                RoleCheck(
                    "DENY SELECT movimientos",
                    "SELECT 1 FROM Movimientos LIMIT 1",
                    False,
                ),
            ],
        ),
        "supervisor": (
            super_url,
            [
                RoleCheck(
                    "SELECT vista_inventario_actual",
                    "SELECT 1 FROM vista_inventario_actual LIMIT 1",
                    True,
                ),
                RoleCheck(
                    "SELECT vista_historial_movimientos",
                    "SELECT 1 FROM vista_historial_movimientos LIMIT 1",
                    True,
                ),
                RoleCheck(
                    "CALL sp_consultar_inventario",
                    "CALL sp_consultar_inventario()",
                    True,
                ),
                RoleCheck(
                    "DENY SELECT productos",
                    "SELECT 1 FROM Productos LIMIT 1",
                    False,
                ),
            ],
        ),
    }

    total = 0
    passed = 0

    print("Running DB role access checks...")
    for role_name, (db_url, role_checks) in checks.items():
        print(f"\n[{role_name.upper()}]")
        for check in role_checks:
            total += 1
            ok, error = run_check(db_url, check)
            if ok:
                passed += 1
                print(f"  PASS - {check.name}")
            else:
                print(f"  FAIL - {check.name}")
                if error:
                    print(f"         {error}")

    print(f"\nSummary: {passed}/{total} checks passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
