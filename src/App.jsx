import './App.css'
import { useState } from 'react';
import GoalForm from './components/goalform';

function App(){
  const [userGoal, setUserGoal] = useState('');  // This stores the goal after submission

  return (
    <div>
      {!userGoal ? (
        // If no goal yet → show the form
        <GoalForm onSubmit={setUserGoal} />
      ) : (
        // If goal is submitted → show this
        <div>
          <p>Okay, let’s talk.</p>
          <p><strong>Your goal:</strong> {userGoal}</p>
        </div>
      )}
    </div>
  );
}

export default App;