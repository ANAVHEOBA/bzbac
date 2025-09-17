curl -X POST http://localhost:5000/campaigns/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU3Njg1MTYxLCJleHAiOjE3NTgyODk5NjF9.WV51VGpXfJ2SeSLZn00Ws0K8VNDg-WCYMbpIDO8sPM4" \
  -F "slug=screencast-2025-05qq-13" \
  -F "caption=Queue test with webm screencast" \
  -F "waLink=https://wa.me/1234567890" \
  -F "waButtonLabel=Chat on WhatsApp" \
  -F "full=@/home/a/bzbac/screencast.webm"
{"jobId":"1","status":"queued"}