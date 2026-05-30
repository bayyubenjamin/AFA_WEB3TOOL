;; Math util updated 2026-05-30T21:02:41Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u64)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
