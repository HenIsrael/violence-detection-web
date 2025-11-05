import React from 'react';
import './ResultMessage.css';

interface ResultMessageProps {
  predictedClass: string;
  confidence: number;
}

const ResultMessage: React.FC<ResultMessageProps> = ({ predictedClass, confidence }) => {
  const confidencePercent = Math.round(confidence * 100);
  const isViolence = predictedClass === 'VIOLENCE';
  const highlightText = isViolence ? 'Violent' : 'No violent';
  const restOfMessage = isViolence 
    ? ` content detected (confidence: ${confidencePercent}%)`
    : ` activity detected (confidence: ${confidencePercent}%)`;

  return (
    <p className="result-message">
      <span className={`result-highlight ${isViolence ? 'violence' : 'no-violence'}`}>
        {highlightText}
      </span>
      {restOfMessage}
    </p>
  );
};

export default ResultMessage;

