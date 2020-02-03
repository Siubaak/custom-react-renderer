import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const increase = () => setCount(c => c + 1);
  const decrease = () => setCount(c => c - 1);
  return (
    <div>
      <button onClick={increase}>+</button>
      <span>{count}</span>
      <button onClick={decrease}>-</button>
    </div>
  );
}

export default App;
