using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodExam.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "code_executions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    language = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    source_code = table.Column<string>(type: "text", nullable: false),
                    stdin_text = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    stdout_text = table.Column<string>(type: "text", nullable: true),
                    stderr_text = table.Column<string>(type: "text", nullable: true),
                    execution_time_ms = table.Column<int>(type: "integer", nullable: true),
                    memory_used_kb = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_code_executions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "system_error_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    source_service = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    error_title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    error_message = table.Column<string>(type: "text", nullable: false),
                    stack_trace = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_system_error_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(72)", maxLength: 72, nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    role = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "active"),
                    refresh_token = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    refresh_token_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "compile_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    execution_id = table.Column<Guid>(type: "uuid", nullable: false),
                    runner_container_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    job_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Queued"),
                    queued_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    finished_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_compile_jobs", x => x.id);
                    table.ForeignKey(
                        name: "fk_compile_jobs_code_executions_execution_id",
                        column: x => x.execution_id,
                        principalTable: "code_executions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    details = table.Column<JsonDocument>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_audit_logs_users_actor_user_id",
                        column: x => x.actor_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "quizzes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    mode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    anti_cheat_options = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    form_schema = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    access_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_quizzes", x => x.id);
                    table.ForeignKey(
                        name: "fk_quizzes_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "questions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    quiz_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    points = table.Column<int>(type: "integer", nullable: false, defaultValue: 10),
                    order_no = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    options = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_questions", x => x.id);
                    table.ForeignKey(
                        name: "fk_questions_quizzes_quiz_id",
                        column: x => x.quiz_id,
                        principalTable: "quizzes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quiz_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    quiz_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    session_token = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    form_data = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ends_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    finished_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_locked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    total_score = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_quiz_sessions", x => x.id);
                    table.ForeignKey(
                        name: "fk_quiz_sessions_quizzes_quiz_id",
                        column: x => x.quiz_id,
                        principalTable: "quizzes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_quiz_sessions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "test_cases",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    question_id = table.Column<Guid>(type: "uuid", nullable: false),
                    input = table.Column<string>(type: "text", nullable: false, defaultValue: ""),
                    expected_output = table.Column<string>(type: "text", nullable: false),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    order_no = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_test_cases", x => x.id);
                    table.ForeignKey(
                        name: "fk_test_cases_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "exam_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    quiz_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    severity = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exam_events", x => x.id);
                    table.ForeignKey(
                        name: "fk_exam_events_quiz_sessions_session_id",
                        column: x => x.session_id,
                        principalTable: "quiz_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "submissions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_id = table.Column<Guid>(type: "uuid", nullable: false),
                    language = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    execution_time_ms = table.Column<int>(type: "integer", nullable: true),
                    memory_used_kb = table.Column<int>(type: "integer", nullable: true),
                    score = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_submissions", x => x.id);
                    table.ForeignKey(
                        name: "fk_submissions_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_submissions_quiz_sessions_session_id",
                        column: x => x.session_id,
                        principalTable: "quiz_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "submission_replays",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    submission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    diffs = table.Column<JsonDocument>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_submission_replays", x => x.id);
                    table.ForeignKey(
                        name: "fk_submission_replays_submissions_submission_id",
                        column: x => x.submission_id,
                        principalTable: "submissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_actor_user_id",
                table: "audit_logs",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_entity_type_entity_id",
                table: "audit_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_code_executions_status",
                table: "code_executions",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_compile_jobs_execution_id",
                table: "compile_jobs",
                column: "execution_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_exam_events_metadata",
                table: "exam_events",
                column: "metadata")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "ix_exam_events_session_id",
                table: "exam_events",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "ix_exam_events_session_id_timestamp",
                table: "exam_events",
                columns: new[] { "session_id", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "ix_questions_quiz_id",
                table: "questions",
                column: "quiz_id");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_sessions_form_data",
                table: "quiz_sessions",
                column: "form_data")
                .Annotation("Npgsql:IndexMethod", "GIN");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_sessions_is_active",
                table: "quiz_sessions",
                column: "is_active",
                filter: "is_active = true");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_sessions_quiz_id",
                table: "quiz_sessions",
                column: "quiz_id");

            migrationBuilder.CreateIndex(
                name: "ix_quiz_sessions_session_token",
                table: "quiz_sessions",
                column: "session_token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_quiz_sessions_user_id",
                table: "quiz_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_quizzes_owner_id",
                table: "quizzes",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_quizzes_status",
                table: "quizzes",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ix_submission_replays_submission_id",
                table: "submission_replays",
                column: "submission_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_submissions_question_id",
                table: "submissions",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "ix_submissions_session_id",
                table: "submissions",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "ix_system_error_logs_created_at",
                table: "system_error_logs",
                column: "created_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_test_cases_question_id",
                table: "test_cases",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_deleted_at",
                table: "users",
                column: "deleted_at",
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "compile_jobs");

            migrationBuilder.DropTable(
                name: "exam_events");

            migrationBuilder.DropTable(
                name: "submission_replays");

            migrationBuilder.DropTable(
                name: "system_error_logs");

            migrationBuilder.DropTable(
                name: "test_cases");

            migrationBuilder.DropTable(
                name: "code_executions");

            migrationBuilder.DropTable(
                name: "submissions");

            migrationBuilder.DropTable(
                name: "questions");

            migrationBuilder.DropTable(
                name: "quiz_sessions");

            migrationBuilder.DropTable(
                name: "quizzes");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
