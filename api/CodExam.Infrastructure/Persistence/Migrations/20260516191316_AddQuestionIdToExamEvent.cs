using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CodExam.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionIdToExamEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "preferences_json",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "security_stamp",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "quizzes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AddColumn<DateTime>(
                name: "ends_at",
                table: "quizzes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "participation_token",
                table: "quizzes",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<DateTime>(
                name: "starts_at",
                table: "quizzes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "question_id",
                table: "exam_events",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_quizzes_participation_token",
                table: "quizzes",
                column: "participation_token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_exam_events_question_id",
                table: "exam_events",
                column: "question_id");

            migrationBuilder.AddForeignKey(
                name: "fk_exam_events_questions_question_id",
                table: "exam_events",
                column: "question_id",
                principalTable: "questions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_exam_events_questions_question_id",
                table: "exam_events");

            migrationBuilder.DropIndex(
                name: "ix_quizzes_participation_token",
                table: "quizzes");

            migrationBuilder.DropIndex(
                name: "ix_exam_events_question_id",
                table: "exam_events");

            migrationBuilder.DropColumn(
                name: "preferences_json",
                table: "users");

            migrationBuilder.DropColumn(
                name: "security_stamp",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ends_at",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "participation_token",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "starts_at",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "question_id",
                table: "exam_events");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "quizzes",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);
        }
    }
}
