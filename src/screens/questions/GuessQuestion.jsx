import GuessLayout from '../../components/design/GuessLayout.jsx'

export default function GuessQuestion({ question, language, disabled, targetName, targetColor, onAnswer }) {
  return (
    <GuessLayout
      targetName={targetName}
      targetInitial={targetName?.charAt(0)}
      targetColor={targetColor}
      options={question.options.map((option) => option[language])}
      disabled={disabled}
      onSelect={(index) => onAnswer(question.options[index].id)}
    />
  )
}
