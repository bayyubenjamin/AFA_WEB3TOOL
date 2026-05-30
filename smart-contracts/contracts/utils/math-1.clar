;; Math util updated 2026-05-30T10:27:05Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u23)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
