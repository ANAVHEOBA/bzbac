a@a:~/bzbac$ curl -X POST http://localhost:5000/admin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bezaleeldennis@gmail.com","password":"bzassetar"}'
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU1OTA2NjEyLCJleHAiOjE3NTY1MTE0MTJ9.fW8LGeZejMNkC3201GDB4rnP4jjaTef5cYc9xM-aP



curl -X POST http://localhost:5000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bezaleeldennis@gmail.com","password":"bzassetar"}'
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU2NTU5MTkzLCJleHAiOjE3NTcxNjM5OTN9.MVapQfK6aMAm8pJKojMhjTLxNGTAQZ7k9gT7fhkyPaQ"}




dd t wor then : a@a:~/bzbac$ curl -X POST http://localhost:5000/campaigns/upload   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU2MTQzNDA0LCJleHAiOjE3NTY3NDgyMDR9.EziZ9Sr9di_zxj1_VJukK1LeawVtIcJxv7CVOPqZWeE"   -F "slug=test-campaign-15"   -F "waLink=https://wa.me/1234567890 "   -F "waButtonLabel=Order on WhatsApp"   -F "caption=Testing popup"   -F "popupTriggerType=seconds"   -F "popupTriggerValue=8"   -F "preview=@preview.mp4"   -F "full=@full.mp4"
{"slug":"test-campaign-15","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.mp4 ","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.mp4 ","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.jpg ","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.jpg ","waLink":"https://wa.me/1234567890 ","waButtonLabel":"Order on WhatsApp","caption":"Testing popup","popupTriggerType":"seconds","popupTriggerValue":8,"_id":"68aca58a2d4c475fc9b4b11b","createdAt":"2025-08-25T18:03:54.354Z","updatedAt":"2025-08-25T18:03:54.354Z","__v":0}a@a:~/bzbac$ 










curl -X GET http://localhost:5000/campaigns/test-campaign-1
{"slug":"test-campaign-1","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.mp4","waLink":"https://wa.me/1234567890","caption":"Test campaign created via curl","createdAt":"2025-08-23T01:14:29.184Z","updatedAt":"2025-08-23T11:56:36.236Z","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.jpg","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_preview.jpg"}







ths : curl http://localhost:5000/campaigns/public/links
[{"slug":"test-campaign-15","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.mp4 ","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.jpg ","waLink":"https://wa.me/1234567890 ","waButtonLabel":"Order on WhatsApp","popupTriggerType":"seconds","popupTriggerValue":8},{"slug":"What","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756142112/campaigns/What%20_full.mp4 ","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756142112/campaigns/What%20_full.jpg ","waLink":"WhatsApp","waButtonLabel":"Chat on WhatsApp","popupTriggerType":null,"popupTriggerValue":null},{"slug":"Camping","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756032871/campaigns/Camping%20_full.mp4 ","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756032871/campaigns/Camping%20_full.jpg ","waLink":"WhatsApp ","waButtonLabel":"Chat on WhatsApp","popupTriggerType":null,"popupTriggerValue":null},{"slug":"what do u mean bro","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755940432/campaigns/what%20do%20u%20mean%20bro_full.webm ","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755940432/campaigns/what%20do%20u%20mean%20bro_full.jpg ","waLink":"https://wa.me/1234567890 ","waButtonLabel":"Chat on WhatsApp","popupTriggerType":null,"popupTriggerValue":null}]a@a:~/bzbac$ 












[
  {
    "slug": "U there bro",
    "fullVideoUrl": "https://res.cloudinary.com/defo7ecih/video/upload/v1756033008/campaigns/U%20there%20bro_full.mp4  ",
    "fullThumbnailUrl": "https://res.cloudinary.com/defo7ecih/video/upload/v1756033008/campaigns/U%20there%20bro_full.jpg  ",
    "waLink": "WhatsApp"
  },
  {
    "slug": "Camping",
    "fullVideoUrl": "https://res.cloudinary.com/defo7ecih/video/upload/v1756032871/campaigns/Camping%20_full.mp4  ",
    "fullThumbnailUrl": "https://res.cloudinary.com/defo7ecih/video/upload/v1756032871/campaigns/Camping%20_full.jpg  ",
    "waLink": "WhatsApp "
  },
  {
    "slug": "what do u mean bro",
    "fullVideoUrl": "https://res.cloudinary.com/defo7ecih/video/upload/v1755940432/campaigns/what%20do%20u%20mean%20bro_full.webm  ",
    "fullThumbnailUrl": "https://res.cloudinary.com/defo7ecih/video/upload/v1755940432/campaigns/what%20do%20u%20mean%20bro_full.jpg  ",
    "waLink": "https://wa.me/1234567890  "
  }
]











curl -X POST http://localhost:5000/campaigns/upload   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU2MTQzNDA0LCJleHAiOjE3NTY3NDgyMDR9.EziZ9Sr9di_zxj1_VJukK1LeawVtIcJxv7CVOPqZWeE"   -F "slug=test-campaign-15"   -F "waLink=https://wa.me/1234567890 "   -F "waButtonLabel=Order on WhatsApp"   -F "caption=Testing popup"   -F "popupTriggerType=seconds"   -F "popupTriggerValue=8"   -F "preview=@preview.mp4"   -F "full=@full.mp4"
{"slug":"test-campaign-15","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.mp4","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.jpg","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.jpg","waLink":"https://wa.me/1234567890","waButtonLabel":"Order on WhatsApp","caption":"Testing popup","popupTriggerType":"seconds","popupTriggerValue":8,"_id":"68b4203dba2ca4d391089e6d","createdAt":"2025-08-31T10:13:17.088Z","updatedAt":"2025-08-31T10:13:17.088Z","__v":0}aurl -X PUT http://localhost:5000/campaigns/test-campaign-15   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU2NjM0MjkzLCJleHAiOjE3NTcyMzkwOTN9.NPAST9gH-9LStg1yzh71d1Qjdc7p03O_qN43k0zVrWI"   -F "slug=test-campaign-15"   -F "waLink=https://wa.me/9876543210"   -F "waButtonLabel=Chat Now"   -F "caption=Updated caption after JSON edit"   -F "popupTriggerType=percent"   -F "popupTriggerValue=75"   -F "preview=@preview.mp4"   -F "full=@full.mp4"
{"_id":"68b4203dba2ca4d391089e6d","slug":"test-campaign-15","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.mp4","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.jpg","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.jpg","waLink":"https://wa.me/9876543210","waButtonLabel":"Chat Now","caption":"Updated caption after JSON edit","popupTriggerType":"percent","popupTriggerValue":75,"createdAt":"2025-08-31T10:13:17.088Z","updatedAt":"2025-08-31T10:13:28.238Z","__v":0}a@a:~/bzbac$ 





curl -X PUT http://localhost:5000/campaigns/test-campaign-15   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU2NjM0MjkzLCJleHAiOjE3NTcyMzkwOTN9.NPAST9gH-9LStg1yzh71d1Qjdc7p03O_qN43k0zVrWI"   -F "slug=test-campaign-15"   -F "waLink=https://wa.me/9876543210"   -F "waButtonLabel=Chat Now"   -F "caption=Updated caption after JSON edit"   -F "popupTriggerType=percent"   -F "popupTriggerValue=75"   -F "preview=@preview.mp4"   -F "full=@full.mp4"
{"_id":"68b4203dba2ca4d391089e6d","slug":"test-campaign-15","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.mp4","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.jpg","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.jpg","waLink":"https://wa.me/9876543210","waButtonLabel":"Chat Now","caption":"Updated caption after JSON edit","popupTriggerType":"percent","popupTriggerValue":75,"createdAt":"2025-08-31T10:13:17.088Z","updatedAt":"2025-08-31T10:14:14.154Z","__v":0}a@a:~/bzbac$ 




curl -X PUT http://localhost:5000/campaigns/test-campaign-15   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU2NjM0MjkzLCJleHAiOjE3NTcyMzkwOTN9.NPAST9gH-9LStg1yzh71d1Qjdc7p03O_qN43k0zVrWI"   -H "Content-Type: application/json"   -d '{
    "caption": "Only caption changed",
    "waButtonLabel": "New button text",
    "popupTriggerType": "seconds",
    "popupTriggerValue": 12
  }'

{"_id":"68b4203dba2ca4d391089e6d","slug":"test-campaign-15","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.mp4","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_preview.jpg","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1756145033/campaigns/test-campaign-15_full.jpg","waLink":"https://wa.me/9876543210","waButtonLabel":"New button text","caption":"Only caption changed","popupTriggerType":"seconds","popupTriggerValue":12,"createdAt":"2025-08-31T10:13:17.088Z","updatedAt":"2025-08-31T10:19:36.098Z","__v":0}