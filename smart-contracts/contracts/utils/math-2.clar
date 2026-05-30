;; Math util updated 2026-05-30T07:48:00Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u12)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
