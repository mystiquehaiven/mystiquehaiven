"use client";

import { createPortal } from "react-dom";
import { PREDEFINED_TAGS } from "@/components/admin/UploadForm";

interface Props {
	open: boolean;
	onClose: () => void;
	tags: string[];
	onToggleTag: (tag: string) => void;
	onSave: () => void;
	onDelete: () => void;
	isSaving: boolean;
	isDeleting: boolean;
	isAdmin: boolean;
}

export default function AdminPanelModal({
	open,
	onClose,
	tags,
	onToggleTag,
	onSave,
	onDelete,
	isSaving,
	isDeleting,
	isAdmin,
}: Props) {
	if (!open || !isAdmin) return null;

	return createPortal(
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<span>Edit Video</span>
					<button onClick={onClose}>✕</button>
				</div>

				<div className="modal-body">
					<div className="tag-grid">
						{PREDEFINED_TAGS.map((tag) => (
							<button
								key={tag}
								className={tags.includes(tag) ? "active" : ""}
								onClick={() => onToggleTag(tag)}
							>
								{tag}
							</button>
						))}
					</div>
				</div>

				<div className="modal-actions">
					<button onClick={onSave} disabled={isSaving}>
						{isSaving ? "Saving..." : "Save"}
					</button>

					<button onClick={onDelete} disabled={isDeleting}>
						{isDeleting ? "Deleting..." : "Delete"}
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
}