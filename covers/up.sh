set -e
i=0
files=(hero-steady.jpg hero-weekly.jpg card-01.jpg card-02.jpg card-03.jpg card-04.jpg row-01.jpg row-02.jpg row-03.jpg row-04.jpg)
urls=(
"https://mcp.figma.com/mcp/upload/214b0033-11bf-4ee3-960e-6e35d42fc239/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/5ec23360-1494-470b-8901-a20589979071/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/131f8228-a688-402d-ba25-9d45523d366a/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/9249dc0c-552a-48ca-9447-39f0f5dd7d6c/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/c611152f-fa4d-4796-984e-e427a784f4bc/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/12db7106-f1ae-40c2-b01c-6755343bb3bd/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/6c74c2da-e065-41ea-93c1-9f63f27d9b34/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/5ce20cdb-5f56-4606-8773-00c01379c34f/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/c713c3f1-4aa7-4319-8d98-2c5a1478c49f/submit?scaleMode=FILL"
"https://mcp.figma.com/mcp/upload/36927791-a498-4882-9a94-8d695da58943/submit?scaleMode=FILL"
)
for f in "${files[@]}"; do
  printf '%s -> ' "$f"
  curl -s -X POST -F "file=@${f};type=image/jpeg" "${urls[$i]}"
  printf '\n'
  i=$((i+1))
done
