namespace CodExam.Domain.Enums;

public enum QuizStatus
{
    Draft,
    Active,
    Ended,
    Published,   // validated + scheduled, awaiting StartsAt
    Archived     // manually archived
}
