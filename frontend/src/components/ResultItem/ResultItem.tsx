import React from 'react';
import './ResultItem.css';

interface ResultItemProps {
  label: string;
  value: string | number;
}

const ResultItem: React.FC<ResultItemProps> = ({ label, value }) => {
  return (
    <div className="result-item">
      <span className="result-label">{label}</span>
      <span className="result-value">{value}</span>
    </div>
  );
};

export default ResultItem;

