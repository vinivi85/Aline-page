// Integração Zoom via Server-to-Server OAuth.
// Requer app criado em https://marketplace.zoom.us (tipo "Server-to-Server OAuth")
// com o scope: meeting:write:admin (ou meeting:write se for conta única).

async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID!;
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao obter token Zoom: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function createZoomMeeting(params: {
  topic: string;
  startTimeISO: string;
  durationMinutes: number;
  timezone: string;
  attendeeEmail: string;
}) {
  const token = await getZoomAccessToken();

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // reunião agendada
      start_time: params.startTimeISO,
      duration: params.durationMinutes,
      timezone: params.timezone,
      agenda: `Sessão com ${params.attendeeEmail}`,
      settings: {
        join_before_host: false,
        waiting_room: true,
        approval_type: 2, // não requer aprovação manual
        meeting_authentication: false,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao criar reunião Zoom: ${res.status} ${await res.text()}`);
  }

  const meeting = await res.json();
  return {
    id: String(meeting.id),
    joinUrl: meeting.join_url as string,
    startUrl: meeting.start_url as string,
  };
}

export async function updateZoomMeetingTime(params: {
  meetingId: string;
  startTimeISO: string;
  durationMinutes: number;
  timezone: string;
}) {
  const token = await getZoomAccessToken();

  const res = await fetch(`https://api.zoom.us/v2/meetings/${params.meetingId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start_time: params.startTimeISO,
      duration: params.durationMinutes,
      timezone: params.timezone,
    }),
  });

  // Zoom retorna 204 sem corpo quando dá certo
  if (!res.ok && res.status !== 204) {
    throw new Error(`Falha ao atualizar reunião Zoom: ${res.status} ${await res.text()}`);
  }
}

export async function deleteZoomMeeting(meetingId: string) {
  const token = await getZoomAccessToken();

  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    throw new Error(`Falha ao excluir reunião Zoom: ${res.status} ${await res.text()}`);
  }
}
