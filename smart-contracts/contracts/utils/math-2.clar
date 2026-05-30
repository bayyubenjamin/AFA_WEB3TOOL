;; Math util updated 2026-05-30T14:12:20Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u38)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
