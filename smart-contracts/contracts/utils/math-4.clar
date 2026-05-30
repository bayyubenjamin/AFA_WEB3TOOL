;; Math util updated 2026-05-30T09:42:38Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u20)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
