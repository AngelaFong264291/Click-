export default function ChoiceQuestion({ question, language, disabled, onAnswer }) {
  return (
    <div className="question-options">
      {question.options.map((option) => (
        <button key={option.id} type="button" disabled={disabled} onClick={() => onAnswer(option.id)}>
          {option[language]}
        </button>
      ))}
    </div>
  )
}