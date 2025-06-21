import React, { useState, useEffect, useMemo } from 'react'
import PatientCard from './components/PatientCard'
import AddPatient from './components/AddPatient'

function App() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [draggedPatientId, setDraggedPatientId] = useState(null)
  const [isDraggingFromCompleted, setIsDraggingFromCompleted] = useState(false)
  const [orderingMode, setOrderingMode] = useState('automatic') // 'manual' or 'automatic'
  const [chatInput, setChatInput] = useState('')
  const [isProcessingChat, setIsProcessingChat] = useState(false)
  const [completedPatients, setCompletedPatients] = useState([])

  // Fetch patients from backend
  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5001/api/patients')
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }
      const data = await response.json()
      setPatients(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new patient
  const addPatient = async (patientData) => {
    try {
      const response = await fetch('http://localhost:5001/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error('Failed to add patient')
      }

      const newPatient = await response.json()
      setPatients(prev => [...prev, newPatient])
      setShowAddModal(false)
    } catch (err) {
      setError(err.message)
    }
  }

  // Update patient
  const updatePatient = async (patientId, patientData) => {
    try {
      const response = await fetch(`http://localhost:5001/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error('Failed to update patient')
      }

      const updatedPatient = await response.json()
      setPatients(prev => 
        prev.map(patient => 
          patient.id === patientId ? updatedPatient : patient
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    console.log('Drag start:', index)
    setDraggedIndex(index)
    setDraggedPatientId(patients[index].id)
    setIsDraggingFromCompleted(false)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    // Only allow reordering in manual mode
    if (orderingMode === 'manual' && draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    console.log('Drop at index:', dropIndex, 'from dragged index:', draggedIndex)
    
    // Only allow reordering in manual mode
    if (orderingMode === 'manual' && draggedIndex !== null && draggedIndex !== dropIndex) {
      try {
        setPatients(prevPatients => {
          const newPatients = [...prevPatients]
          const draggedPatient = newPatients[draggedIndex]
          
          // Remove from original position
          newPatients.splice(draggedIndex, 1)
          
          // Insert at new position
          newPatients.splice(dropIndex, 0, draggedPatient)
          
          console.log('Reordered patients:', newPatients)
          return newPatients
        })
      } catch (error) {
        console.error('Error reordering patients:', error)
      }
    }
    
    // Reset drag state
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDraggedPatientId(null)
    setIsDraggingFromCompleted(false)
  }

  const handleDragEnd = (e) => {
    console.log('Drag end')
    setDraggedIndex(null)
    setDragOverIndex(null)
    setDraggedPatientId(null)
    setIsDraggingFromCompleted(false)
  }

  // Global drag end handler to catch any missed drag end events
  const handleGlobalDragEnd = () => {
    // Small delay to ensure all drag operations are complete
    setTimeout(() => {
      setDraggedIndex(null)
      setDragOverIndex(null)
    }, 100)
  }

  // Generate patient from chat
  const handleGeneratePatient = (patientData) => {
    setPatients(prev => [...prev, patientData])
  }

  // Complete patient
  const handleCompletePatient = (patientId) => {
    const patientToComplete = patients.find(p => p.id === patientId)
    if (patientToComplete) {
      // Add completion timestamp
      const completedPatient = {
        ...patientToComplete,
        completed_at: new Date().toISOString()
      }
      
      // Move to completed list
      setCompletedPatients(prev => [completedPatient, ...prev])
      
      // Remove from active list
      setPatients(prev => prev.filter(p => p.id !== patientId))
      
      // Reset drag state
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }

  // Reactivate patient (move from completed back to active)
  const handleReactivatePatient = (patientId) => {
    console.log('handleReactivatePatient called with:', patientId)
    
    // Safety check - ensure patientId is valid
    if (!patientId) {
      console.error('Invalid patient ID provided')
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    
    const patientToReactivate = completedPatients.find(p => p.id === patientId)
    console.log('Found patient to reactivate:', patientToReactivate)
    
    if (patientToReactivate) {
      try {
        // Create a clean copy of the patient without completion data
        const reactivatedPatient = {
          id: patientToReactivate.id,
          name: patientToReactivate.name || 'Unknown Patient',
          age: patientToReactivate.age || 0,
          gender: patientToReactivate.gender || '',
          symptoms: patientToReactivate.symptoms || '',
          vitals: patientToReactivate.vitals || {},
          medical_history: patientToReactivate.medical_history || '',
          arrival_time: patientToReactivate.arrival_time || new Date().toISOString(),
          priority_score: patientToReactivate.priority_score || 0,
          priority_level: patientToReactivate.priority_level || 'Low'
        }
        
        console.log('Reactivated patient:', reactivatedPatient)
        
        // Move back to active list - add to the end to avoid reordering issues
        setPatients(prev => {
          // Safety check - ensure prev is an array
          if (!Array.isArray(prev)) {
            console.error('Previous patients state is not an array:', prev)
            return [reactivatedPatient]
          }
          
          const newPatients = [...prev, reactivatedPatient]
          console.log('New patients array:', newPatients)
          return newPatients
        })
        
        // Remove from completed list
        setCompletedPatients(prev => {
          // Safety check - ensure prev is an array
          if (!Array.isArray(prev)) {
            console.error('Previous completed patients state is not an array:', prev)
            return []
          }
          
          const newCompleted = prev.filter(p => p.id !== patientId)
          console.log('New completed array:', newCompleted)
          return newCompleted
        })
        
        console.log('Patient reactivated successfully')
        
        // Reset drag state
        setDraggedIndex(null)
        setDragOverIndex(null)
      } catch (error) {
        console.error('Error reactivating patient:', error)
        // Reset drag state even if there's an error
        setDraggedIndex(null)
        setDragOverIndex(null)
      }
    } else {
      console.error('Patient not found in completed list:', patientId)
      // Reset drag state
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }

  // Handle chat input submission
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isProcessingChat) return

    const description = chatInput.trim()
    setChatInput('')
    setIsProcessingChat(true)

    try {
      const response = await fetch('http://localhost:5001/api/generate-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate patient')
      }

      const result = await response.json()
      
      if (result.success) {
        handleGeneratePatient(result.patient)
        setError(null)
      } else {
        setError('Could not create patient from description. Please try being more specific.')
      }
    } catch (err) {
      setError('Error generating patient: ' + err.message)
    } finally {
      setIsProcessingChat(false)
    }
  }

  // Order patients based on current mode
  const orderedPatients = useMemo(() => {
    if (orderingMode === 'automatic') {
      // Sort by priority score (highest first)
      return [...patients].sort((a, b) => b.priority_score - a.priority_score)
    } else {
      // Manual ordering - keep current order
      return patients
    }
  }, [patients, orderingMode])

  const getPriorityClass = (level) => {
    const levelLower = level.toLowerCase()
    if (levelLower.includes('critical')) return 'critical'
    if (levelLower.includes('high')) return 'high'
    if (levelLower.includes('medium')) return 'medium'
    if (levelLower.includes('low')) return 'low'
    return 'very-low'
  }

  useEffect(() => {
    fetchPatients()
    
    // Add global drag end handler
    document.addEventListener('dragend', handleGlobalDragEnd)
    
    // Cleanup
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd)
    }
  }, [])

  // Safety check for state
  if (!Array.isArray(patients)) {
    console.error('Patients state is not an array:', patients)
    setPatients([])
    return <div>Loading...</div>
  }

  if (!Array.isArray(completedPatients)) {
    console.error('Completed patients state is not an array:', completedPatients)
    setCompletedPatients([])
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>HealthCards</h1>
        <p>AI-Powered Healthcare Priority System</p>
      </div>

      <div className="chat-section">
        <div className="chat-input-container">
          <form onSubmit={handleChatSubmit} className="chat-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe a patient (e.g., '45-year-old male with chest pain, BP 160/100, HR 95')"
              disabled={isProcessingChat}
              className="chat-input-field"
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim() || isProcessingChat}
              className="chat-submit-btn"
            >
              {isProcessingChat ? 'Processing...' : 'Add Patient'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="error">
          Error: {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      <button 
        className="add-patient-btn"
        onClick={() => setShowAddModal(true)}
      >
        + Add New Patient
      </button>

      <div className="main-content">
        <div className="active-patients">
          <div className="active-patients-header">
            <h3>Active Patients ({orderedPatients.length})</h3>
            <div className="ordering-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={orderingMode === 'automatic'}
                  onChange={(e) => setOrderingMode(e.target.checked ? 'automatic' : 'manual')}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">
                {orderingMode === 'automatic' ? 'Auto (Priority)' : 'Manual (Drag)'}
              </span>
            </div>
          </div>
          <div 
            className="priority-queue"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              e.currentTarget.style.borderColor = '#28a745'
              e.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
              const data = e.dataTransfer.getData('text/plain')
              console.log('Drop data:', data)
              if (data) {
                // Check if it's a patient ID from completed patients (for reactivation)
                const patientId = data
                const isFromCompleted = completedPatients.find(p => p.id === patientId)
                console.log('Is from completed:', isFromCompleted)
                if (isFromCompleted) {
                  // This is a patient being reactivated from completed
                  console.log('Reactivating patient:', patientId)
                  handleReactivatePatient(patientId)
                }
              }
            }}
          >
            {orderedPatients.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                No patients in queue. Add a patient to get started.
              </div>
            ) : (
              orderedPatients.map((patient, index) => (
                <React.Fragment key={patient.id}>
                  {orderingMode === 'manual' && dragOverIndex === index && draggedIndex !== null && draggedIndex !== index && (
                    <div 
                      className="drop-indicator"
                      style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: '2px',
                        margin: '10px 0',
                        gridColumn: '1 / -1'
                      }}
                    />
                  )}
                  <PatientCard
                    patient={patient}
                    index={index}
                    onUpdate={updatePatient}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    orderingMode={orderingMode}
                  />
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <div className="completed-patients">
          <h3>Completed ({completedPatients.length})</h3>
          <div 
            className="completed-queue"
            onDragEnter={(e) => {
              e.preventDefault()
              console.log('Drag enter on completed queue')
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              console.log('Drag over on completed queue, draggedPatientId:', draggedPatientId)
              
              if (draggedPatientId) {
                const isFromCompleted = completedPatients.find(p => p.id === draggedPatientId)
                console.log('Is from completed:', isFromCompleted)
                if (isFromCompleted) {
                  // Highlight for reactivation
                  e.currentTarget.style.borderColor = '#667eea'
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'
                } else {
                  // Highlight for completion - show the green background
                  e.currentTarget.style.borderColor = '#28a745'
                  e.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'
                }
              } else {
                // If no draggedPatientId, assume it's an active patient being completed
                e.currentTarget.style.borderColor = '#28a745'
                e.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              console.log('Drag leave on completed queue')
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            onDrop={(e) => {
              e.preventDefault()
              console.log('Drop on completed queue, draggedPatientId:', draggedPatientId)
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
              
              if (draggedPatientId) {
                // Check if it's a patient ID from active patients (for completion) or completed patients (for reactivation)
                const isFromCompleted = completedPatients.find(p => p.id === draggedPatientId)
                console.log('Is from completed:', isFromCompleted)
                if (isFromCompleted) {
                  // This is a patient being reactivated from completed
                  console.log('Reactivating patient:', draggedPatientId)
                  handleReactivatePatient(draggedPatientId)
                } else {
                  // This is a patient being completed from active
                  console.log('Completing patient:', draggedPatientId)
                  handleCompletePatient(draggedPatientId)
                }
              }
              
              // Reset drag state
              setDraggedIndex(null)
              setDragOverIndex(null)
              setDraggedPatientId(null)
              setIsDraggingFromCompleted(false)
            }}
          >
            {completedPatients.length === 0 ? (
              <div className="empty-completed-zone">
                <div className="complete-icon">✓</div>
                <h4>Complete Patients</h4>
                <p>Drag active patients here to mark them as complete</p>
              </div>
            ) : (
              <div className="completed-content">
                <div className="completed-cards-overlay">
                  {completedPatients.map((patient, index) => (
                    <div 
                      key={patient.id} 
                      className="completed-card"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', patient.id)
                        e.dataTransfer.effectAllowed = 'move'
                        e.currentTarget.style.opacity = '0.5'
                        e.currentTarget.style.transform = 'scale(0.95)'
                        setDraggedPatientId(patient.id)
                        setIsDraggingFromCompleted(true)
                        console.log('Drag start - patient ID:', patient.id)
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.transform = 'scale(1)'
                        // Reset drag state
                        setDraggedIndex(null)
                        setDragOverIndex(null)
                        setDraggedPatientId(null)
                        setIsDraggingFromCompleted(false)
                      }}
                      style={{ cursor: 'grab' }}
                    >
                      <div className="completed-card-header">
                        <div className="completed-patient-name">{patient.name || 'Unknown Patient'}</div>
                        <div className="completion-time">
                          {new Date(patient.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="completed-card-details">
                        <div className="completed-info">
                          <span>{patient.age} years old</span>
                          <span>•</span>
                          <span>{patient.gender || 'Not specified'}</span>
                          <span>•</span>
                          <span className={`completed-priority ${getPriorityClass(patient.priority_level)}`}>
                            {patient.priority_level}
                          </span>
                        </div>
                        <div className="completed-symptoms">
                          {patient.symptoms || 'No symptoms recorded'}
                        </div>
                      </div>
                      <div className="completed-card-hint">
                        Drag back to reactivate
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddPatient
          onAdd={addPatient}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

export default App 