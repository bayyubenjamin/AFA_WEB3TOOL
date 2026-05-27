;; Math util updated 2026-05-27T12:11:03Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u7)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
