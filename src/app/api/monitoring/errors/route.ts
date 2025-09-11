import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { logs } = await request.json()

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json({ error: 'Invalid logs format' }, { status: 400 })
    }

    // Créer le dossier logs s'il n'existe pas
    const logsDir = path.join(process.cwd(), 'logs')
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true })
    }

    // Nom du fichier avec la date
    const today = new Date().toISOString().split('T')[0]
    const logFile = path.join(logsDir, `errors-${today}.json`)

    // Lire les logs existants ou créer un nouveau fichier
    let existingLogs = []
    if (existsSync(logFile)) {
      try {
        const fileContent = await readFile(logFile, 'utf-8')
        existingLogs = JSON.parse(fileContent)
      } catch {
        // Fichier corrompu, on repart à zéro
        existingLogs = []
      }
    }

    // Ajouter les nouveaux logs
    const allLogs = [...existingLogs, ...logs]

    // Sauvegarder
    await writeFile(logFile, JSON.stringify(allLogs, null, 2))

    console.log(`✅ Saved ${logs.length} error logs to ${logFile}`)

    return NextResponse.json({ success: true, saved: logs.length })
  } catch (error) {
    console.error('Error saving logs:', error)
    return NextResponse.json({ error: 'Failed to save logs' }, { status: 500 })
  }
}
