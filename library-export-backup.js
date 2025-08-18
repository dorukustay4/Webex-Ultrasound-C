// Clean backup export function for library
async function exportSession(sessionId) {
  console.log(`📤 Exporting session ${sessionId}`);
  
  if (!window.electronAPI || !window.electronAPI.dbGetSessionDetails) {
    showToast('Database not available', 'error');
    return;
  }
  
  try {
    const result = await window.electronAPI.dbGetSessionDetails(sessionId);
    
    if (!result.success || !result.session) {
      showToast('Session not found', 'error');
      return;
    }
    
    const session = result.session;
    const annotations = result.annotations || [];
    
    const exportData = {
      sessionInfo: {
        id: session.id,
        title: session.title,
        attendees: session.attendees || session.doctor_name,
        category: session.category,
        startTime: session.start_time || session.startTime,
        endTime: session.end_time || session.endTime,
        totalAnnotations: annotations.length,
        status: session.status
      },
      format: 'flattened_annotation_image_pairs',
      description: 'Session export from database',
      annotations: annotations.map(annotation => ({
        annotationId: annotation.id,
        annotationTimestamp: annotation.timestamp || annotation.created_at,
        annotationType: annotation.annotationType || annotation.type || 'polygon',
        annotationPoints: annotation.points,
        nerveType: annotation.nerveType || annotation.nerve_type,
        sideOfBody: annotation.sideOfBody || annotation.side_of_body,
        patientPosition: annotation.patientPosition || annotation.patient_position,
        visibility: annotation.visibility,
        patientAgeGroup: annotation.patientAgeGroup || annotation.patient_age_group,
        needleApproach: annotation.needleApproach || annotation.needle_approach,
        clinicalNotes: annotation.clinicalNotes || annotation.clinical_notes,
        imageId: annotation.imageId || annotation.image_id
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${session.id}_${session.category || 'annotations'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${annotations.length} annotations`, 'success');
    
  } catch (error) {
    console.error('❌ Export error:', error);
    showToast('Export failed', 'error');
  }
}
