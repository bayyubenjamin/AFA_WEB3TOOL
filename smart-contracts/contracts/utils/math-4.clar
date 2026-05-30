;; Math util updated 2026-05-30T19:45:10Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u59)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
