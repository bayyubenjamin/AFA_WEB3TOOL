;; Math util updated 2026-05-28T09:31:17Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u9)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
