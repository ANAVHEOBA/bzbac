a@a:~/bzbac$ curl -X POST http://localhost:5000/admin/register \
  -H "Content-Type: application/json" \
  -d '{"email":"bezaleeldennis@gmail.com","password":"bzassetar"}'
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU1OTA2NjEyLCJleHAiOjE3NTY1MTE0MTJ9.fW8LGeZejMNkC3201GDB4rnP4jjaTef5cYc9xM-aP



curl -X POST http://localhost:5000/admin/login \000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bezaleeldennis@gmail.com","password":"bzassetar"}'
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU1OTA2NjI2LCJleHAiOjE3NTY1MTE0MjZ9.EXTVrh8lhJUMa4Nchv8CtWEZ-b8rF5f8E5J0vQm9tO0"}a@a:~/bzbac$ 






curl -X POST http://localhost:5000/campaigns/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTkwMjM0ZGY2Y2YzMDQzNGNmNjU4MCIsImVtYWlsIjoiYmV6YWxlZWxkZW5uaXNAZ21haWwuY29tIiwiaWF0IjoxNzU1OTA2NjI2LCJleHAiOjE3NTY1MTE0MjZ9.EXTVrh8lhJUMa4Nchv8CtWEZ-b8rF5f8E5J0vQm9tO0" \
  -F "slug=test-campaign-12" \
  -F "waLink=https://wa.me/1234567890 " \
  -F "caption=Test campaign created via curl" \
  -F "preview=@preview.mp4" \
  -F "full=@full.mp4"
{"slug":"test-campaign-12","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755949316/campaigns/test-campaign-12_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755949316/campaigns/test-campaign-12_full.mp4","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755949316/campaigns/test-campaign-12_preview.jpg","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755949316/campaigns/test-campaign-12_full.jpg","waLink":"https://wa.me/1234567890","caption":"Test campaign created via curl","_id":"68a9a9047ab3fc7b3a764b16","createdAt":"2025-08-23T11:41:56.899Z","updatedAt":"2025-08-23T11:41:56.899Z","__v":0}a@a:~/bzbac$ 








curl -X GET http://localhost:5000/campaigns/test-campaign-1
{"slug":"test-campaign-1","snapVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_preview.mp4","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.mp4","waLink":"https://wa.me/1234567890","caption":"Test campaign created via curl","createdAt":"2025-08-23T01:14:29.184Z","updatedAt":"2025-08-23T11:56:36.236Z","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.jpg","snapThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_preview.jpg"}







a@a:~/bzbac$ curl http://localhost:5000/campaigns/public/links
[{"slug":"test-campaign-12","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755949316/campaigns/test-campaign-12_full.mp4","fullThumbnailUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755949316/campaigns/test-campaign-12_full.jpg","waLink":"https://wa.me/1234567890"},{"slug":"what do u mean bro","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755940432/campaigns/what%20do%20u%20mean%20bro_full.webm","waLink":"https://wa.me/1234567890"},{"slug":"what do u mean","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755940270/campaigns/what%20do%20u%20mean%20_full.webm","waLink":"https://wa.me/1234567890"},{"slug":"test-campaign-1","fullVideoUrl":"https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.mp4","waLink":"https://wa.me/1234567890"}]a@a:~/bzbac$ 