import { NextResponse } from 'next/server'

const RAG_UPDATE_ENDPOINT = 'http://3.144.84.183:8020/update_index'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { index_id, type } = body

    const response = await fetch(RAG_UPDATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ index_id, type }),
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in update-rag API route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

