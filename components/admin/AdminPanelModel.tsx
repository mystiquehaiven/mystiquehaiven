"use client";

import { createPortal } from "react-dom";
import { PREDEFINED_TAGS } from "../../lib/tags";
import styles from "../../app/styles/AdminPanelModal.module.css";


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
	<div className={styles.overlay} onClick={onClose}>
		<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
			<div className={styles.modalHeader}>
				<span>Edit Video</span>
				<button onClick={onClose}>✕</button>
			</div>

			<div className={styles.modalBody}>
				<div className={styles.tagGrid}>
					{PREDEFINED_TAGS.map((tag) => (
						<button
							key={tag}
							className={tags.includes(tag) ? styles.active : ""}
							onClick={() => onToggleTag(tag)}
						>
							{tag}
						</button>
					))}
				</div>
			</div>

			<div className={styles.modalActions}>
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