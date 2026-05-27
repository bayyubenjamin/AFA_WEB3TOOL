;; Math util updated 2026-05-27T13:22:38Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u12)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
