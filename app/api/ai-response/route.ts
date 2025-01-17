import { NextResponse } from 'next/server'

const AI_ENDPOINT = 'http://3.144.84.183:8020/generate_answer_channel'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { channelId, message } = body

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        index_id: channelId,
        msg: message,
      }),
    })

    if (!response.ok) {
      throw new Error('AI service response was not ok')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in AI response generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

