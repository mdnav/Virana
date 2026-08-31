# Image Testing Rules for HeritageLens

- Accepted MIME types: image/jpeg, image/png, image/webp only.
- Client resizes/converts before sending. Max ~4MB base64 payload.
- No animated GIFs (extract first frame if needed).
- Non-blank, non-solid-color images only.
- Backend passes base64 (without `data:` prefix) to `ImageContent(image_base64=...)`.
- Model: `gemini/gemini-3.1-pro-preview` for HeritageLens.
