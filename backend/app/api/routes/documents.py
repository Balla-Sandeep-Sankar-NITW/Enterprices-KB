from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional
import math, asyncio

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.models import Document, DocumentStatus, Department, User, UserRole
from app.schemas.schemas import DocumentResponse, DocumentListResponse, DocumentUpdateRequest
from app.services.document_service import save_uploaded_file, process_document, delete_file
from app.services.vector_store import delete_document_vectors

router = APIRouter(prefix="/documents", tags=["Documents"])


def _doc_response(doc: Document, db: Session) -> DocumentResponse:
    dept = db.query(Department).filter(Department.id == doc.department_id).first()
    uploader = db.query(User).filter(User.id == doc.uploaded_by_id).first()
    return DocumentResponse(
        id=doc.id, title=doc.title, original_filename=doc.original_filename,
        file_type=doc.file_type, file_size=doc.file_size, department_id=doc.department_id,
        department_name=dept.name if dept else None, status=doc.status,
        total_pages=doc.total_pages, total_chunks=doc.total_chunks,
        description=doc.description, tags=doc.tags,
        uploaded_by_name=uploader.full_name if uploader else None,
        created_at=doc.created_at, processed_at=doc.processed_at,
        processing_error=doc.processing_error,
    )


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    department_id: int = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    if not db.query(Department).filter(Department.id == department_id).first():
        raise HTTPException(status_code=404, detail="Department not found")

    meta = save_uploaded_file(file, department_id)
    tags_list = [t.strip() for t in tags.split(",")] if tags else []

    doc = Document(
        title=title,
        original_filename=meta["original_filename"],
        stored_filename=meta["stored_filename"],
        file_path=meta["file_path"],
        file_size=meta["file_size"],
        file_type=meta["file_type"],
        mime_type=meta["mime_type"],
        department_id=department_id,
        uploaded_by_id=admin.id,
        description=description,
        tags=tags_list,
        status=DocumentStatus.UPLOADED,
    )
    db.add(doc); db.commit(); db.refresh(doc)

    # Process in background (async)
    async def bg_process():
        await process_document(db, doc.id)

    background_tasks.add_task(asyncio.run, bg_process())
    return _doc_response(doc, db)


@router.get("/", response_model=DocumentListResponse)
def list_docs(
    page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    department_id: Optional[int] = None, status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    q = db.query(Document)
    if current_user.role != UserRole.ADMIN:
        if not current_user.department_id:
            return DocumentListResponse(documents=[], total=0, page=page, per_page=per_page, pages=0)
        q = q.filter(Document.department_id == current_user.department_id)
    elif department_id:
        q = q.filter(Document.department_id == department_id)

    if status: q = q.filter(Document.status == status)
    if search: q = q.filter((Document.title.ilike(f"%{search}%")) | (Document.original_filename.ilike(f"%{search}%")))

    total = q.count()
    docs = q.order_by(Document.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return DocumentListResponse(
        documents=[_doc_response(d, db) for d in docs],
        total=total, page=page, per_page=per_page,
        pages=math.ceil(total / per_page) if total else 0
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_doc(doc_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    if current_user.role != UserRole.ADMIN and doc.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _doc_response(doc, db)


@router.put("/{doc_id}", response_model=DocumentResponse)
def update_doc(doc_id: int, data: DocumentUpdateRequest, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(doc, k, v)
    db.commit(); db.refresh(doc)
    return _doc_response(doc, db)


@router.delete("/{doc_id}", response_model=dict)
def delete_doc(doc_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    delete_document_vectors(doc.id)
    delete_file(doc.file_path)
    db.delete(doc); db.commit()
    return {"message": "Document deleted"}


@router.post("/{doc_id}/reprocess", response_model=dict)
async def reprocess(doc_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(status_code=404, detail="Document not found")
    doc.status = DocumentStatus.UPLOADED
    doc.processing_error = None
    db.commit()

    async def bg():
        await process_document(db, doc_id)
    background_tasks.add_task(asyncio.run, bg())
    return {"message": "Queued for reprocessing"}
