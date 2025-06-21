import React, { useState } from 'react'

function PatientCard({ patient, onUpdate, onDragStart, onDragOver, onDrop, onDragEnd, index, isDragging, orderingMode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ ...patient })

  const getPriorityClass = (level) => {
    const levelLower = level.toLowerCase()
    if (levelLower.includes('critical')) return 'critical'
    if (levelLower.includes('high')) return 'high'
    if (levelLower.includes('medium')) return 'medium'
    if (levelLower.includes('low')) return 'low'
    return 'very-low'
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSave = async () => {
    try {
      await onUpdate(patient.id, editData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update patient:', error)
    }
  }

  const handleCancel = () => {
    setEditData({ ...patient })
    setIsEditing(false)
  }

  const handleDragStart = (e) => {
    console.log('PatientCard drag start - patient ID:', patient.id)
    e.dataTransfer.setData('text/plain', patient.id)
    e.dataTransfer.effectAllowed = 'move'
    console.log('Data transfer set to:', e.dataTransfer.getData('text/plain'))
    onDragStart(e, index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver(e, index)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    onDrop(e, index)
  }

  const priorityClass = getPriorityClass(patient.priority_level)

  return (
    <div 
      className={`patient-card ${priorityClass} ${isDragging ? 'dragging' : ''}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      style={{
        cursor: isEditing ? 'default' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.2s ease'
      }}
    >
      <div className="card-header">
        <div className="patient-name">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="form-input"
              style={{ fontSize: '1.3rem', fontWeight: '600' }}
            />
          ) : (
            patient.name || 'Unknown Patient'
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isEditing && orderingMode === 'manual' && (
            <div 
              className="drag-handle"
              style={{
                cursor: 'grab',
                padding: '4px',
                color: '#6c757d',
                fontSize: '1.2rem',
                userSelect: 'none'
              }}
              title="Drag to reorder"
            >
              ⋮⋮
            </div>
          )}
          <div className={`priority-badge ${priorityClass}`}>
            {patient.priority_level} ({patient.priority_score.toFixed(1)})
          </div>
        </div>
      </div>

      <div className="patient-info">
        <div className="info-row">
          <span className="info-label">Age:</span>
          <span className="info-value">
            {isEditing ? (
              <input
                type="number"
                value={editData.age}
                onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) || 0 })}
                className="form-input"
                style={{ width: '80px', textAlign: 'center' }}
              />
            ) : (
              patient.age
            )}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Gender:</span>
          <span className="info-value">
            {isEditing ? (
              <select
                value={editData.gender}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                className="form-input"
                style={{ width: '100px' }}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              patient.gender || 'Not specified'
            )}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Arrival:</span>
          <span className="info-value">{formatTime(patient.arrival_time)}</span>
        </div>
      </div>

      <div className="symptoms">
        <h4>Symptoms</h4>
        {isEditing ? (
          <textarea
            value={editData.symptoms}
            onChange={(e) => setEditData({ ...editData, symptoms: e.target.value })}
            className="form-textarea"
            placeholder="Describe patient symptoms..."
          />
        ) : (
          <p>{patient.symptoms || 'No symptoms recorded'}</p>
        )}
      </div>

      {patient.vitals && (
        <div className="vitals-grid">
          <div className="vital-item">
            <div className="vital-label">BP</div>
            <div className="vital-value">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.vitals?.blood_pressure || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    vitals: { ...editData.vitals, blood_pressure: e.target.value }
                  })}
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '1rem' }}
                  placeholder="120/80"
                />
              ) : (
                patient.vitals.blood_pressure || 'N/A'
              )}
            </div>
          </div>
          <div className="vital-item">
            <div className="vital-label">HR</div>
            <div className="vital-value">
              {isEditing ? (
                <input
                  type="number"
                  value={editData.vitals?.heart_rate || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    vitals: { ...editData.vitals, heart_rate: e.target.value }
                  })}
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '1rem' }}
                  placeholder="72"
                />
              ) : (
                patient.vitals.heart_rate || 'N/A'
              )}
            </div>
          </div>
          <div className="vital-item">
            <div className="vital-label">Temp</div>
            <div className="vital-value">
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  value={editData.vitals?.temperature || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    vitals: { ...editData.vitals, temperature: e.target.value }
                  })}
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '1rem' }}
                  placeholder="98.6"
                />
              ) : (
                patient.vitals.temperature ? `${patient.vitals.temperature}°F` : 'N/A'
              )}
            </div>
          </div>
          <div className="vital-item">
            <div className="vital-label">O2 Sat</div>
            <div className="vital-value">
              {isEditing ? (
                <input
                  type="number"
                  value={editData.vitals?.oxygen_saturation || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    vitals: { ...editData.vitals, oxygen_saturation: e.target.value }
                  })}
                  className="form-input"
                  style={{ textAlign: 'center', fontSize: '1rem' }}
                  placeholder="98"
                />
              ) : (
                patient.vitals.oxygen_saturation ? `${patient.vitals.oxygen_saturation}%` : 'N/A'
              )}
            </div>
          </div>
        </div>
      )}

      <div className="symptoms">
        <h4>Medical History</h4>
        {isEditing ? (
          <textarea
            value={editData.medical_history}
            onChange={(e) => setEditData({ ...editData, medical_history: e.target.value })}
            className="form-textarea"
            placeholder="Relevant medical history..."
          />
        ) : (
          <p>{patient.medical_history || 'N/A'}</p>
        )}
      </div>

      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="submit-btn"
              style={{ flex: 1, fontSize: '0.9rem', padding: '8px' }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                fontSize: '0.9rem',
                padding: '8px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              width: '100%',
              fontSize: '0.9rem',
              padding: '8px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Edit Patient
          </button>
        )}
      </div>
    </div>
  )
}

export default PatientCard 