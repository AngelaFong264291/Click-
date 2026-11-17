import AnswerOption from '../../components/design/AnswerOption.jsx'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function ChoiceQuestion({ question, language, disabled, onAnswer }) {
  return (
    <div className="stack">
      {question.options.map((option, index) => (
        <AnswerOption
          key={option.id}
          letter={LETTERS[index]}
          label={option[language]}
          disabled={disabled}
          onClick={() => onAnswer(option.id)}
        />
      ))}
    </div>
  )
}
