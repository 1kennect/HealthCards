import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function App() {
    const [input, setInput] = useState('');
    const [patients, setPatients] = useState([]);

    const sendChat = async () => {
        const res = await axios.post('http://127.0.0.1:8000/chat', { user_input: input });
        if (res.data.patient) {
            setPatients(prev => [...prev, res.data.patient]);
        } else {
            alert("Error parsing patient info.");
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(patients);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPatients(items);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>AI Triage Board</h1>

            <textarea value={input} onChange={e => setInput(e.target.value)} />
            <br />
            <button onClick={sendChat}>Add Patient</button>

            <h2>Patients</h2>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="patients">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {patients.map((p, i) => (
                                <Draggable key={i} draggableId={`patient-${i}`} index={i}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{
                                                padding: 16,
                                                margin: '0 0 8px 0',
                                                background: '#f9f9f9',
                                                border: '1px solid #ddd',
                                                borderRadius: 4,
                                                ...provided.draggableProps.style
                                            }}
                                        >
                                            <strong>{p.name}</strong><br />
                                            Age: {p.age || 'Unknown'}<br />
                                            Gender: {p.gender}<br />
                                            Condition: {p.condition}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}

export default App;
