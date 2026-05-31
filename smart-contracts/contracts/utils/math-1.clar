;; Math util updated 2026-05-31T02:02:22Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u86)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
