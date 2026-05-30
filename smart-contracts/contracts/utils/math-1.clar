;; Math util updated 2026-05-30T21:59:53Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u68)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
