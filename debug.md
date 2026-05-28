(base) PS C:\Users\yusti\Desktop\bitirme projesi\SPMS\Backend> uvicorn app.api.main:app --reload
INFO:     Will watch for changes in these directories: ['C:\\Users\\yusti\\Desktop\\bitirme projesi\\SPMS\\Backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [26692] using WatchFiles
INFO:     Started server process [18744]
INFO:     Waiting for application startup.
2026-05-28 11:52:57,884 INFO sqlalchemy.engine.Engine select pg_catalog.version()
select pg_catalog.version()
2026-05-28 11:52:57,884 INFO sqlalchemy.engine.Engine [raw sql] ()
[raw sql] ()
2026-05-28 11:52:57,887 INFO sqlalchemy.engine.Engine select current_schema()
select current_schema()
2026-05-28 11:52:57,887 INFO sqlalchemy.engine.Engine [raw sql] ()
[raw sql] ()
2026-05-28 11:52:57,889 INFO sqlalchemy.engine.Engine show standard_conforming_strings
show standard_conforming_strings
2026-05-28 11:52:57,889 INFO sqlalchemy.engine.Engine [raw sql] ()
[raw sql] ()
2026-05-28 11:52:57,891 INFO sqlalchemy.engine.Engine BEGIN (implicit)
BEGIN (implicit)
2026-05-28 11:52:57,893 INFO sqlalchemy.engine.Engine SELECT count(*) AS count_1 
FROM audit_log
SELECT count(*) AS count_1 
FROM audit_log
2026-05-28 11:52:57,894 INFO sqlalchemy.engine.Engine [generated in 0.00025s] ()
[generated in 0.00025s] ()
SEEDER: Veritabanı dolumu başlatılıyor...
... Roller oluşturuluyor
2026-05-28 11:52:57,933 INFO sqlalchemy.engine.Engine SELECT roles.id, roles.name, roles.description, roles.is_system_role, roles.icon_key, roles.color_token 
FROM roles
SELECT roles.id, roles.name, roles.description, roles.is_system_role, roles.icon_key, roles.color_token 
FROM roles
2026-05-28 11:52:57,933 INFO sqlalchemy.engine.Engine [generated in 0.00027s] ()
[generated in 0.00027s] ()
... Kullanıcılar oluşturuluyor
2026-05-28 11:52:57,939 INFO sqlalchemy.engine.Engine SELECT users.id, users.email, users.password_hash, users.full_name, users.is_active, users.avatar, users.role_id, users.created_at, users.version, users.updated_at, users.is_deleted, users.deleted_at 
FROM users
SELECT users.id, users.email, users.password_hash, users.full_name, users.is_active, users.avatar, users.role_id, users.created_at, users.version, users.updated_at, users.is_deleted, users.deleted_at 
FROM users
2026-05-28 11:52:57,939 INFO sqlalchemy.engine.Engine [generated in 0.00041s] ()
[generated in 0.00041s] ()
... Süreç şablonları oluşturuluyor
2026-05-28 11:52:57,945 INFO sqlalchemy.engine.Engine SELECT process_templates.id, process_templates.name, process_templates.is_builtin, process_templates.columns, process_templates.recurring_tasks, process_templates.behavioral_flags, process_templates.description, process_templates.created_at, process_templates.updated_at, process_templates.default_artifacts, process_templates.default_phase_criteria, process_templates.default_workflow, process_templates.cycle_label_tr, process_templates.cycle_label_en, process_templates.default_columns 
FROM process_templates
SELECT process_templates.id, process_templates.name, process_templates.is_builtin, process_templates.columns, process_templates.recurring_tasks, process_templates.behavioral_flags, process_templates.description, process_templates.created_at, process_templates.updated_at, process_templates.default_artifacts, process_templates.default_phase_criteria, process_templates.default_workflow, process_templates.cycle_label_tr, process_templates.cycle_label_en, process_templates.default_columns 
FROM process_templates
2026-05-28 11:52:57,945 INFO sqlalchemy.engine.Engine [generated in 0.00022s] ()
[generated in 0.00022s] ()
... Projeler oluşturuluyor
2026-05-28 11:52:57,953 INFO sqlalchemy.engine.Engine SELECT projects.id, projects.key, projects.name, projects.description, projects.start_date, projects.end_date, projects.methodology, projects.manager_id, projects.created_at, projects.custom_fields, projects.process_config, projects.task_seq, projects.status, projects.process_template_id, projects.version, projects.updated_at, projects.is_deleted, projects.deleted_at 
FROM projects
SELECT projects.id, projects.key, projects.name, projects.description, projects.start_date, projects.end_date, projects.methodology, projects.manager_id, projects.created_at, projects.custom_fields, projects.process_config, projects.task_seq, projects.status, projects.process_template_id, projects.version, projects.updated_at, projects.is_deleted, projects.deleted_at 
FROM projects
2026-05-28 11:52:57,954 INFO sqlalchemy.engine.Engine [generated in 0.00027s] ()
[generated in 0.00027s] ()
2026-05-28 11:52:57,978 INFO sqlalchemy.engine.Engine SELECT process_templates.id, process_templates.name, process_templates.is_builtin, process_templates.columns, process_templates.recurring_tasks, process_templates.behavioral_flags, process_templates.description, process_templates.created_at, process_templates.updated_at, process_templates.default_artifacts, process_templates.default_phase_criteria, process_templates.default_workflow, process_templates.cycle_label_tr, process_templates.cycle_label_en, process_templates.default_columns 
FROM process_templates
SELECT process_templates.id, process_templates.name, process_templates.is_builtin, process_templates.columns, process_templates.recurring_tasks, process_templates.behavioral_flags, process_templates.description, process_templates.created_at, process_templates.updated_at, process_templates.default_artifacts, process_templates.default_phase_criteria, process_templates.default_workflow, process_templates.cycle_label_tr, process_templates.cycle_label_en, process_templates.default_columns 
FROM process_templates
2026-05-28 11:52:57,979 INFO sqlalchemy.engine.Engine [cached since 0.03367s ago] ()
[cached since 0.03367s ago] ()
2026-05-28 11:52:57,980 INFO sqlalchemy.engine.Engine COMMIT
COMMIT
SEEDER: Temel veriler commit edildi.
EXTENDED SEEDER: Başlatılıyor...
2026-05-28 11:52:57,982 INFO sqlalchemy.engine.Engine BEGIN (implicit)
BEGIN (implicit)
2026-05-28 11:52:57,983 INFO sqlalchemy.engine.Engine SELECT roles.id, roles.name, roles.description, roles.is_system_role, roles.icon_key, roles.color_token 
FROM roles
SELECT roles.id, roles.name, roles.description, roles.is_system_role, roles.icon_key, roles.color_token 
FROM roles
2026-05-28 11:52:57,983 INFO sqlalchemy.engine.Engine [cached since 0.0502s ago] ()
[cached since 0.0502s ago] ()
EXTENDED SEEDER: Ek kullanıcılar oluşturuluyor (→ 100 toplam)
2026-05-28 11:52:57,984 INFO sqlalchemy.engine.Engine SELECT users.id, users.email, users.password_hash, users.full_name, users.is_active, users.avatar, users.role_id, users.created_at, users.version, users.updated_at, users.is_deleted, users.deleted_at 
FROM users
SELECT users.id, users.email, users.password_hash, users.full_name, users.is_active, users.avatar, users.role_id, users.created_at, users.version, users.updated_at, users.is_deleted, users.deleted_at 
FROM users
2026-05-28 11:52:57,984 INFO sqlalchemy.engine.Engine [cached since 0.04574s ago] ()
[cached since 0.04574s ago] ()
EXTENDED SEEDER: Yaşam döngüsü şablonları oluşturuluyor
2026-05-28 11:52:57,987 INFO sqlalchemy.engine.Engine SELECT process_templates.id, process_templates.name, process_templates.is_builtin, process_templates.columns, process_templates.recurring_tasks, process_templates.behavioral_flags, process_templates.description, process_templates.created_at, process_templates.updated_at, process_templates.default_artifacts, process_templates.default_phase_criteria, process_templates.default_workflow, process_templates.cycle_label_tr, process_templates.cycle_label_en, process_templates.default_columns 
FROM process_templates
SELECT process_templates.id, process_templates.name, process_templates.is_builtin, process_templates.columns, process_templates.recurring_tasks, process_templates.behavioral_flags, process_templates.description, process_templates.created_at, process_templates.updated_at, process_templates.default_artifacts, process_templates.default_phase_criteria, process_templates.default_workflow, process_templates.cycle_label_tr, process_templates.cycle_label_en, process_templates.default_columns 
FROM process_templates
2026-05-28 11:52:57,987 INFO sqlalchemy.engine.Engine [cached since 0.04231s ago] ()
[cached since 0.04231s ago] ()
EXTENDED SEEDER: Ek projeler oluşturuluyor
2026-05-28 11:52:57,989 INFO sqlalchemy.engine.Engine SELECT projects.id, projects.key, projects.name, projects.description, projects.start_date, projects.end_date, projects.methodology, projects.manager_id, projects.created_at, projects.custom_fields, projects.process_config, projects.task_seq, projects.status, projects.process_template_id, projects.version, projects.updated_at, projects.is_deleted, projects.deleted_at 
FROM projects
SELECT projects.id, projects.key, projects.name, projects.description, projects.start_date, projects.end_date, projects.methodology, projects.manager_id, projects.created_at, projects.custom_fields, projects.process_config, projects.task_seq, projects.status, projects.process_template_id, projects.version, projects.updated_at, projects.is_deleted, projects.deleted_at 
FROM projects
2026-05-28 11:52:57,989 INFO sqlalchemy.engine.Engine [cached since 0.03607s ago] ()
[cached since 0.03607s ago] ()
EXTENDED SEEDER: Tamamlandı — 0 yeni proje, 12 şablon, 89 ek kullanıcı.
2026-05-28 11:52:57,991 INFO sqlalchemy.engine.Engine COMMIT
COMMIT
2026-05-28 11:52:57,993 INFO sqlalchemy.engine.Engine BEGIN (implicit)
BEGIN (implicit)
2026-05-28 11:52:57,993 INFO sqlalchemy.engine.Engine SELECT to_regclass('public.permissions') IS NOT NULL AND to_regclass('public.role_permissions') IS NOT NULL
SELECT to_regclass('public.permissions') IS NOT NULL AND to_regclass('public.role_permissions') IS NOT NULL
2026-05-28 11:52:57,994 INFO sqlalchemy.engine.Engine [generated in 0.00016s] ()
[generated in 0.00016s] ()
2026-05-28 11:52:57,996 INFO sqlalchemy.engine.Engine UPDATE roles SET is_system_role = true WHERE LOWER(name) IN ('admin', 'project manager', 'member')
UPDATE roles SET is_system_role = true WHERE LOWER(name) IN ('admin', 'project manager', 'member')
2026-05-28 11:52:57,996 INFO sqlalchemy.engine.Engine [generated in 0.00021s] ()
[generated in 0.00021s] ()
2026-05-28 11:52:57,998 INFO sqlalchemy.engine.Engine INSERT INTO roles (name, description, is_system_role) SELECT 'Guest', 'Salt okunur misafir hesabı (D-2.4)', true WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'guest')
INSERT INTO roles (name, description, is_system_role) SELECT 'Guest', 'Salt okunur misafir hesabı (D-2.4)', true WHERE NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(name) = 'guest')
2026-05-28 11:52:57,998 INFO sqlalchemy.engine.Engine [generated in 0.00022s] ()
[generated in 0.00022s] ()
2026-05-28 11:52:58,000 INFO sqlalchemy.engine.Engine INSERT INTO permissions (key, label_tr, label_en, scope) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = $1)
INSERT INTO permissions (key, label_tr, label_en, scope) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = $1)
2026-05-28 11:52:58,000 INFO sqlalchemy.engine.Engine [generated in 0.00019s] ('project.create', 'Proje oluştur', 'Create project', 'project')
[generated in 0.00019s] ('project.create', 'Proje oluştur', 'Create project', 'project')
SEEDER HATASI: (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.AmbiguousParameterError'>: inconsistent types deduced for parameter $1
DETAIL:  text versus character varying
[SQL: INSERT INTO permissions (key, label_tr, label_en, scope) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = $1)]
[parameters: ('project.create', 'Proje oluştur', 'Create project', 'project')]
(Background on this error at: https://sqlalche.me/e/20/f405)
2026-05-28 11:52:58,002 INFO sqlalchemy.engine.Engine ROLLBACK
ROLLBACK
ERROR:    Traceback (most recent call last):
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 521, in _prepare_and_execute
    prepared_stmt, attributes = await adapt_connection._prepare(
                                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        operation, self._invalidate_schema_cache_asof
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 768, in _prepare
    prepared_stmt = await self._connection.prepare(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        operation, name=self._prepared_statement_name_func()
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\asyncpg\connection.py", line 638, in prepare
    return await self._prepare(
           ^^^^^^^^^^^^^^^^^^^^
    ...<4 lines>...
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\asyncpg\connection.py", line 657, in _prepare
    stmt = await self._get_statement(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<5 lines>...
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\asyncpg\connection.py", line 443, in _get_statement
    statement = await self._protocol.prepare(
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<5 lines>...
    )
    ^
  File "asyncpg/protocol/protocol.pyx", line 165, in prepare
asyncpg.exceptions.AmbiguousParameterError: inconsistent types deduced for parameter $1
DETAIL:  text versus character varying

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 1964, in _exec_single_context
    self.dialect.do_execute(
    ~~~~~~~~~~~~~~~~~~~~~~~^
        cursor, str_statement, effective_parameters, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\default.py", line 942, in do_execute
    cursor.execute(statement, parameters)
    ~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 580, in execute
    self._adapt_connection.await_(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self._prepare_and_execute(operation, parameters)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\util\_concurrency_py3k.py", line 132, in await_only
    return current.parent.switch(awaitable)  # type: ignore[no-any-return,attr-defined] # noqa: E501
           ~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\util\_concurrency_py3k.py", line 196, in greenlet_spawn
    value = await result
            ^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 558, in _prepare_and_execute
    self._handle_exception(error)
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 508, in _handle_exception
    self._adapt_connection._handle_exception(error)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 792, in _handle_exception
    raise translated_error from error
sqlalchemy.dialects.postgresql.asyncpg.AsyncAdapt_asyncpg_dbapi.ProgrammingError: <class 'asyncpg.exceptions.AmbiguousParameterError'>: inconsistent types deduced for parameter $1
DETAIL:  text versus character varying

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "C:\Users\yusti\anaconda3\Lib\site-packages\starlette\routing.py", line 694, in lifespan
    async with self.lifespan_context(app) as maybe_state:
               ~~~~~~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\fastapi\routing.py", line 211, in merged_lifespan
    async with original_context(app) as maybe_original_state:
               ~~~~~~~~~~~~~~~~^^^^^
  File "C:\Users\yusti\anaconda3\Lib\contextlib.py", line 214, in __aenter__
    return await anext(self.gen)
           ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\Desktop\bitirme projesi\SPMS\Backend\app\api\main.py", line 106, in lifespan
    await seed_data(session)
  File "C:\Users\yusti\Desktop\bitirme projesi\SPMS\Backend\app\infrastructure\database\seeder.py", line 393, in seed_data
    await seed_rbac(session)
  File "C:\Users\yusti\Desktop\bitirme projesi\SPMS\Backend\app\infrastructure\database\_seed_rbac.py", line 133, in seed_rbac
    res = await session.execute(
          ^^^^^^^^^^^^^^^^^^^^^^
    ...<6 lines>...
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\ext\asyncio\session.py", line 463, in execute
    result = await greenlet_spawn(
             ^^^^^^^^^^^^^^^^^^^^^
    ...<6 lines>...
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\util\_concurrency_py3k.py", line 201, in greenlet_spawn
    result = context.throw(*sys.exc_info())
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\orm\session.py", line 2365, in execute
    return self._execute_internal(
           ~~~~~~~~~~~~~~~~~~~~~~^
        statement,
        ^^^^^^^^^^
    ...<4 lines>...
        _add_event=_add_event,
        ^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\orm\session.py", line 2260, in _execute_internal
    result = conn.execute(
        statement, params or {}, execution_options=execution_options
    )
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 1416, in execute
    return meth(
        self,
        distilled_parameters,
        execution_options or NO_OPTIONS,
    )
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\sql\elements.py", line 523, in _execute_on_connection
    return connection._execute_clauseelement(
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self, distilled_params, execution_options
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 1638, in _execute_clauseelement
    ret = self._execute_context(
        dialect,
    ...<8 lines>...
        cache_hit=cache_hit,
    )
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 1843, in _execute_context
    return self._exec_single_context(
           ~~~~~~~~~~~~~~~~~~~~~~~~~^
        dialect, context, statement, parameters
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 1983, in _exec_single_context
    self._handle_dbapi_exception(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        e, str_statement, effective_parameters, cursor, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 2352, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\base.py", line 1964, in _exec_single_context
    self.dialect.do_execute(
    ~~~~~~~~~~~~~~~~~~~~~~~^
        cursor, str_statement, effective_parameters, context
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\engine\default.py", line 942, in do_execute
    cursor.execute(statement, parameters)
    ~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 580, in execute
    self._adapt_connection.await_(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        self._prepare_and_execute(operation, parameters)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\util\_concurrency_py3k.py", line 132, in await_only
    return current.parent.switch(awaitable)  # type: ignore[no-any-return,attr-defined] # noqa: E501
           ~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\util\_concurrency_py3k.py", line 196, in greenlet_spawn
    value = await result
            ^^^^^^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 558, in _prepare_and_execute
    self._handle_exception(error)
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 508, in _handle_exception
    self._adapt_connection._handle_exception(error)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^
  File "C:\Users\yusti\anaconda3\Lib\site-packages\sqlalchemy\dialects\postgresql\asyncpg.py", line 792, in _handle_exception
    raise translated_error from error
sqlalchemy.exc.ProgrammingError: (sqlalchemy.dialects.postgresql.asyncpg.ProgrammingError) <class 'asyncpg.exceptions.AmbiguousParameterError'>: inconsistent types deduced for parameter $1
DETAIL:  text versus character varying
[SQL: INSERT INTO permissions (key, label_tr, label_en, scope) SELECT $1, $2, $3, $4 WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = $1)]
[parameters: ('project.create', 'Proje oluştur', 'Create project', 'project')]
(Background on this error at: https://sqlalche.me/e/20/f405)

ERROR:    Application startup failed. Exiting.