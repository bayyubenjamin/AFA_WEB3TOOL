;; Math util updated 2026-05-30T11:04:49Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u25)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
