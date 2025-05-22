import { useState } from 'react';

function GoalForm({ onSubmit }) {
  const [rawGoal, setRawGoal] = useState('');
  const [processedGoal, setProcessedGoal] = useState('');
  const [stage, setStage] = useState('input');

  const handleInput = (e) => {
    e.preventDefault();
    if (rawGoal.trim() === '') return;
    
    const processed = '"hello hello"';
    setProcessedGoal(processed);
    setStage('confirm');
  };

  const handleConfirmation = () => {
    onSubmit(processedGoal);
  }

  const handleRevise = () => {
    setRawGoal('');
    setProcessedGoal('');
    setStage('input'); //goes back to input stage
  }
  return (
    <div>
      {stage === 'input' && (
        <form onSubmit={handleInput}>
          <label htmlFor="goal">What do you want to achieve?</label><br />
          <input
            id="goal"
            type="text"
            value={rawGoal}
            onChange={(e) => setRawGoal(e.target.value)}
            placeholder="I want to..." />
          <button type="submit">Send</button>
        </form>
      )}
      {stage === 'confirm' && (

        <div>
          <p>It sounds like you want to {processedGoal}, is that right?</p>
          <button onClick={handleConfirmation}>Confirm</button>
          <button onClick={handleRevise}>Revise</button>
        </div>
      )}
    </div>
  )
}

export default GoalForm;