
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from rembg import new_session, remove

app = FastAPI(title="StyleVault Image Service")

# Load the AI model once when the service starts.
print("Loading background-removal model...")
rembg_session = new_session("birefnet-general-lite")
print("Background-removal model is ready!")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "StyleVault Image Service"
    }


@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image."
        )

    try:
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty."
            )

        # Reuse the already-loaded model for every image.
        output_bytes = remove(
            image_bytes,
            session=rembg_session
        )

        return Response(
            content=output_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": 'inline; filename="background_removed.png"'
            }
        )

    except HTTPException:
        raise

    except Exception as error:
        print("Background removal failed:", error)

        raise HTTPException(
            status_code=500,
            detail="Background removal failed. Please try another image."
        )
