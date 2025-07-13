import jsPDF from "jspdf"
import type { Project, Screen, Connection } from "@/types"

export async function exportWorkflowPDF(project: Project, screens: Screen[], connections: Connection[]): Promise<void> {
  const pdf = new jsPDF("landscape", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Header
  pdf.setFontSize(20)
  pdf.text(project.name, 20, 20)

  pdf.setFontSize(12)
  pdf.text(`Source System: ${project.sourceSystem}`, 20, 30)
  pdf.text(`PM: ${project.pmAssigned}`, 20, 37)
  pdf.text(`Status: ${project.status}`, 20, 44)
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 51)

  // Workflow Overview
  pdf.setFontSize(16)
  pdf.text("Workflow Overview", 20, 65)

  let yPos = 75

  // Screen List
  pdf.setFontSize(14)
  pdf.text("Screens:", 20, yPos)
  yPos += 10

  pdf.setFontSize(10)
  screens.forEach((screen, index) => {
    if (yPos > pageHeight - 20) {
      pdf.addPage()
      yPos = 20
    }

    pdf.text(`${index + 1}. ${screen.name}`, 25, yPos)
    if (screen.comments) {
      yPos += 5
      pdf.text(`   Comments: ${screen.comments}`, 25, yPos)
    }
    yPos += 8
  })

  // Connections
  if (connections.length > 0) {
    yPos += 10
    if (yPos > pageHeight - 40) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(14)
    pdf.text("Connections:", 20, yPos)
    yPos += 10

    pdf.setFontSize(10)
    connections.forEach((connection) => {
      if (yPos > pageHeight - 20) {
        pdf.addPage()
        yPos = 20
      }

      const fromScreen = screens.find((s) => s.id === connection.fromScreenId)
      const toScreen = screens.find((s) => s.id === connection.toScreenId)

      if (fromScreen && toScreen) {
        const connectionText = `${fromScreen.name} → ${toScreen.name} (${connection.type})`
        pdf.text(connectionText, 25, yPos)
        if (connection.label) {
          yPos += 5
          pdf.text(`   Label: ${connection.label}`, 25, yPos)
        }
        yPos += 8
      }
    })
  }

  // Save the PDF
  pdf.save(`${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_workflow.pdf`)
}
