;; Math util updated 2026-05-29T06:30:29Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u5)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
