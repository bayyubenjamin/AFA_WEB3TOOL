;; Math util updated 2026-05-29T06:16:13Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u4)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
