import { useState } from 'react';

function GoalForm({ onSubmit }) {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (goal.trim() === '') return;
    onSubmit(goal);  // Send goal back to parent (App)
    setGoal('');     // Clear input after submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="goal">What do you want to achieve?</label><br />
      <input
        id="goal"
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Type your goal here..."
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export default GoalForm;