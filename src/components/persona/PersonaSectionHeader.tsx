import React from 'react';

type Props = { index: string; title: string; note: string; id?: string };
const PersonaSectionHeader: React.FC<Props> = ({ index, title, note, id }) => (
  <div className="persona-section-head">
    <div><span className="persona-index">{index}</span><h2 id={id}>{title}</h2></div>
    <span className="persona-head-note">{note}</span>
  </div>
);
export default PersonaSectionHeader;
